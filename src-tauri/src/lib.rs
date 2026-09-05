use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, State};
use base64::prelude::*;

#[derive(serde::Serialize, Clone, Default, Debug)]
pub struct ActiveApp {
    pub name: String,
    pub duration: u64,
}

#[derive(serde::Serialize, Clone, Default, Debug)]
pub struct ActivityStats {
    pub keystrokes: u64,
    #[serde(rename = "mouseClicks")]
    pub mouse_clicks: u64,
    #[serde(rename = "activeApps")]
    pub active_apps: Vec<ActiveApp>,
}

pub struct TrackerState {
    pub is_tracking: Arc<AtomicBool>,
    pub user_id: Arc<Mutex<String>>,
    pub keystrokes: Arc<AtomicU64>,
    pub mouse_clicks: Arc<AtomicU64>,
    pub active_apps: Arc<Mutex<HashMap<String, u64>>>,
}

impl Default for TrackerState {
    fn default() -> Self {
        Self {
            is_tracking: Arc::new(AtomicBool::new(false)),
            user_id: Arc::new(Mutex::new(String::new())),
            keystrokes: Arc::new(AtomicU64::new(0)),
            mouse_clicks: Arc::new(AtomicU64::new(0)),
            active_apps: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

// -------------------------------------------------------------
// NATIVE OS HELPERS (WINDOWS & CROSS-PLATFORM)
// -------------------------------------------------------------

#[cfg(target_os = "windows")]
fn get_system_idle_seconds_native() -> u64 {
    use windows_sys::Win32::System::SystemInformation::GetTickCount;
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    unsafe {
        let mut lii = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if GetLastInputInfo(&mut lii) != 0 {
            let now = GetTickCount();
            let idle_ms = now.saturating_sub(lii.dwTime);
            (idle_ms / 1000) as u64
        } else {
            0
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn get_system_idle_seconds_native() -> u64 {
    0
}

#[cfg(target_os = "windows")]
fn get_active_app_name_native() -> String {
    use windows_sys::Win32::Foundation::CloseHandle;
    use windows_sys::Win32::System::Threading::{
        OpenProcess, QueryFullProcessImageNameW, PROCESS_QUERY_LIMITED_INFORMATION,
    };
    use windows_sys::Win32::UI::WindowsAndMessaging::{
        GetForegroundWindow, GetWindowThreadProcessId,
    };

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.is_null() {
            return String::new();
        }
        let mut pid = 0;
        GetWindowThreadProcessId(hwnd, &mut pid);
        if pid == 0 {
            return String::new();
        }
        let handle = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, 0, pid);
        if handle.is_null() {
            return String::new();
        }
        let mut buf = [0u16; 1024];
        let mut size = buf.len() as u32;
        let res = QueryFullProcessImageNameW(handle, 0, buf.as_mut_ptr(), &mut size);
        CloseHandle(handle);
        if res != 0 {
            let path_str = String::from_utf16_lossy(&buf[..size as usize]);
            if let Some(filename) = std::path::Path::new(&path_str).file_name() {
                let name = filename.to_string_lossy().to_string();
                return name.trim_end_matches(".exe").to_string();
            }
        }
    }
    String::new()
}

#[cfg(not(target_os = "windows"))]
fn get_active_app_name_native() -> String {
    String::new()
}

#[cfg(target_os = "windows")]
fn check_input_tick_native() -> u32 {
    use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
    unsafe {
        let mut lii = LASTINPUTINFO {
            cbSize: std::mem::size_of::<LASTINPUTINFO>() as u32,
            dwTime: 0,
        };
        if GetLastInputInfo(&mut lii) != 0 {
            lii.dwTime
        } else {
            0
        }
    }
}

#[cfg(not(target_os = "windows"))]
fn check_input_tick_native() -> u32 {
    0
}

fn capture_primary_screen() -> Option<String> {
    let screens = screenshots::Screen::all().ok()?;
    if screens.is_empty() { return None; }

    let mut captures = Vec::new();
    let mut min_x = i32::MAX;
    let mut min_y = i32::MAX;
    let mut max_x = i32::MIN;
    let mut max_y = i32::MIN;

    // Capture all screens and find bounding box
    for screen in screens {
        if let Ok(img) = screen.capture() {
            let info = screen.display_info;
            min_x = min_x.min(info.x);
            min_y = min_y.min(info.y);
            max_x = max_x.max(info.x + info.width as i32);
            max_y = max_y.max(info.y + info.height as i32);
            captures.push((info, img));
        }
    }

    if captures.is_empty() { return None; }

    let total_width = (max_x - min_x) as u32;
    let total_height = (max_y - min_y) as u32;

    // Create a blank black canvas covering all screens
    let mut combined_rgba = image::RgbaImage::from_pixel(total_width, total_height, image::Rgba([0, 0, 0, 255]));

    for (info, img) in captures {
        let offset_x = (info.x - min_x) as i64;
        let offset_y = (info.y - min_y) as i64;
        
        if let Some(rgba) = image::RgbaImage::from_raw(img.width(), img.height(), img.into_raw()) {
            image::imageops::overlay(&mut combined_rgba, &rgba, offset_x, offset_y);
        }
    }

    let dynamic = image::DynamicImage::ImageRgba8(combined_rgba);
    
    // Resize if width is larger than 1920 (to keep file size small for multi-monitor setups)
    let target = if dynamic.width() > 1920 {
        // Calculate new height maintaining aspect ratio
        let new_height = (1920.0 / dynamic.width() as f32 * dynamic.height() as f32) as u32;
        dynamic.resize_exact(1920, new_height, image::imageops::FilterType::Nearest)
    } else {
        dynamic
    };

    let mut jpeg_bytes = Vec::new();
    let mut cursor = std::io::Cursor::new(&mut jpeg_bytes);
    if target.write_to(&mut cursor, image::ImageFormat::Jpeg).is_ok() {
        let b64 = BASE64_STANDARD.encode(&jpeg_bytes);
        return Some(format!("data:image/jpeg;base64,{}", b64));
    }

    None
}

// -------------------------------------------------------------
// TAURI COMMANDS
// -------------------------------------------------------------

mod commands {
    use super::*;

    #[tauri::command]
    pub fn get_system_idle_time() -> u64 {
        get_system_idle_seconds_native()
    }

    #[tauri::command]
    pub fn get_activity_stats(state: State<'_, TrackerState>) -> ActivityStats {
        let keystrokes = state.keystrokes.swap(0, Ordering::Relaxed);
        let mouse_clicks = state.mouse_clicks.swap(0, Ordering::Relaxed);

        let mut map = state.active_apps.lock().unwrap();
        let active_apps: Vec<ActiveApp> = map
            .drain()
            .map(|(name, duration)| ActiveApp { name, duration })
            .collect();

        ActivityStats {
            keystrokes,
            mouse_clicks,
            active_apps,
        }
    }

    #[tauri::command]
    pub fn start_tracking(
        app: AppHandle,
        state: State<'_, TrackerState>,
        user_id: String,
    ) -> Result<bool, String> {
        if state.is_tracking.load(Ordering::Relaxed) {
            return Ok(true);
        }

        state.is_tracking.store(true, Ordering::Relaxed);
        if let Ok(mut u) = state.user_id.lock() {
            *u = user_id;
        }

        let is_tracking_clone = state.is_tracking.clone();
        let active_apps_clone = state.active_apps.clone();
        let keystrokes_clone = state.keystrokes.clone();
        let mouse_clicks_clone = state.mouse_clicks.clone();
        let app_handle_clone = app.clone();

        // Spawn background tracker worker thread
        std::thread::spawn(move || {
            let mut last_screenshot = Instant::now();
            let mut last_input_tick = check_input_tick_native();

            // Capture first screenshot immediately on start
            if let Some(b64) = capture_primary_screen() {
                let _ = app_handle_clone.emit("screenshot-captured", b64);
            }

            while is_tracking_clone.load(Ordering::Relaxed) {
                std::thread::sleep(Duration::from_secs(1));

                // Check if user input occurred in the last second
                let current_tick = check_input_tick_native();
                if current_tick != last_input_tick {
                    last_input_tick = current_tick;
                    mouse_clicks_clone.fetch_add(1, Ordering::Relaxed);
                    keystrokes_clone.fetch_add(1, Ordering::Relaxed);
                }

                // Track active foreground application every 2 seconds
                let app_name = get_active_app_name_native();
                if !app_name.is_empty() {
                    if let Ok(mut map) = active_apps_clone.lock() {
                        let entry = map.entry(app_name).or_insert(0);
                        *entry += 1;
                    }
                }

                // Periodic screenshot every 60 seconds
                if last_screenshot.elapsed() >= Duration::from_secs(60) {
                    last_screenshot = Instant::now();
                    if let Some(b64) = capture_primary_screen() {
                        let _ = app_handle_clone.emit("screenshot-captured", b64);
                    }
                }
            }
        });

        Ok(true)
    }

    #[tauri::command]
    pub fn stop_tracking(state: State<'_, TrackerState>) -> Result<bool, String> {
        state.is_tracking.store(false, Ordering::Relaxed);
        Ok(true)
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(TrackerState::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_system_idle_time,
            commands::get_activity_stats,
            commands::start_tracking,
            commands::stop_tracking,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
