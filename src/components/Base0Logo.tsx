interface Base0LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export function Base0Logo({
  size = 'md',
  variant = 'light',
  showText = true,
  className = ''
}: Base0LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

  const dotSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const logoColor = variant === 'light' ? 'bg-white' : 'bg-black';
  const dotColor = variant === 'light' ? 'bg-black' : 'bg-white';
  const textColor = variant === 'light' ? 'text-white' : 'text-black';

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className={`${sizeClasses[size]} ${logoColor} rounded-full flex items-center justify-center`}>
        <div className={`${dotSizeClasses[size]} ${dotColor} rounded-full`}></div>
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold ${textColor}`}>Base0</span>
      )}
    </div>
  );
}
