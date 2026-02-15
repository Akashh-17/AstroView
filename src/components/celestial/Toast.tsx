/**
 * Toast.tsx
 * 
 * Toast notification component for confirmation feedback
 */

import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
    message: string;
    detail?: string;
    duration?: number;
    onClose: () => void;
}

export default function Toast({ message, detail, duration = 4000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose();
        }, 300); // Match exit animation duration
    };

    return (
        <>
            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideInBottom {
                    from {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100px);
                        opacity: 0;
                    }
                }
                
                @keyframes slideOutBottom {
                    from {
                        transform: translateY(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateY(100px);
                        opacity: 0;
                    }
                }
                
                @keyframes progressCountdown {
                    from { width: 100%; }
                    to { width: 0%; }
                }
                
                @keyframes checkmarkScale {
                    0% {
                        transform: scale(0) rotate(0deg);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.2) rotate(180deg);
                    }
                    100% {
                        transform: scale(1) rotate(360deg);
                        opacity: 1;
                    }
                }
                
                .toast-enter {
                    animation: slideInRight 400ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .toast-enter-mobile {
                    animation: slideInBottom 400ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .toast-exit {
                    animation: slideOutRight 300ms ease-in;
                }
                
                .toast-exit-mobile {
                    animation: slideOutBottom 300ms ease-in;
                }
                
                .toast-progress {
                    animation: progressCountdown ${duration}ms linear;
                }
                
                .checkmark-icon {
                    animation: checkmarkScale 500ms cubic-bezier(0.4, 0, 0.2, 1);
                }
            `}</style>

            {/* Desktop: Top-right */}
            <div
                className={`hidden md:block fixed top-6 right-6 z-[9999] w-[320px] ${isExiting ? 'toast-exit' : 'toast-enter'
                    }`}
                style={{
                    background: 'rgba(13, 17, 23, 0.95)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.6), 0px 0px 20px rgba(0, 217, 255, 0.15)',
                }}
            >
                <div className="flex items-start gap-3">
                    {/* Success Icon */}
                    <div className="checkmark-icon flex-shrink-0">
                        <CheckCircle2 size={24} style={{ color: '#00FFAA' }} />
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-white mb-1">
                            {message}
                        </div>
                        {detail && (
                            <div className="text-[13px] text-white/60 leading-relaxed">
                                {detail}
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 transition-colors duration-150"
                        style={{ color: '#888888' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#888888')}
                        aria-label="Close notification"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div
                    className="absolute bottom-0 left-0 h-[3px] rounded-b-xl toast-progress"
                    style={{
                        background: 'linear-gradient(90deg, #00D9FF 0%, #0099CC 100%)',
                    }}
                />
            </div>

            {/* Mobile: Bottom-center */}
            <div
                className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[320px] ${isExiting ? 'toast-exit-mobile' : 'toast-enter-mobile'
                    }`}
                style={{
                    background: 'rgba(13, 17, 23, 0.95)',
                    backdropFilter: 'blur(15px)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    boxShadow: '0px 8px 32px rgba(0, 0, 0, 0.6), 0px 0px 20px rgba(0, 217, 255, 0.15)',
                }}
            >
                <div className="flex items-start gap-3">
                    {/* Success Icon */}
                    <div className="checkmark-icon flex-shrink-0">
                        <CheckCircle2 size={24} style={{ color: '#00FFAA' }} />
                    </div>

                    {/* Message Content */}
                    <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-white mb-1">
                            {message}
                        </div>
                        {detail && (
                            <div className="text-[13px] text-white/60 leading-relaxed">
                                {detail}
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0"
                        style={{ color: '#888888' }}
                        aria-label="Close notification"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Progress Bar */}
                <div
                    className="absolute bottom-0 left-0 h-[3px] rounded-b-xl toast-progress"
                    style={{
                        background: 'linear-gradient(90deg, #00D9FF 0%, #0099CC 100%)',
                    }}
                />
            </div>
        </>
    );
}
