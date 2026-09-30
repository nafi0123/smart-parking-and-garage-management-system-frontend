import type { ReactNode } from 'react';

type ContainerProps = {
  children: ReactNode;
  className?: string;
};

const Container = ({ children, className = '' }: ContainerProps) => {
  return (
    <div
      className={`mx-auto max-w-7xl xl:max-w-[1380px] 2xl:max-w-[1440px] px-4 sm:px-6 lg:px-8 ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default Container;
