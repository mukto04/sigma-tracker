import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, padding = 'md', children, ...props }, ref) => {
    const classNames = [styles.card, styles[`padding-${padding}`], className].filter(Boolean).join(' ');

    return (
      <div className={classNames} ref={ref} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
