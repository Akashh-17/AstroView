/**
 * ReminderToggle.tsx
 * 
 * Animated toggle switch component for event reminders
 */

import { Bell, BellRing } from 'lucide-react';

interface ReminderToggleProps {
    eventId: string;
    eventName: string;
    eventDate: string;
    isActive: boolean;
    onToggle: (active: boolean) => void;
}

export default function ReminderToggle({
    eventId,
    eventName,
    eventDate,
    isActive,
    onToggle,
}: ReminderToggleProps) {
    const handleClick = () => {
        onToggle(!isActive);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            onToggle(!isActive);
        }
    };

    return (
        <>
            <style>{`
                @keyframes glowPulse {
                    0%, 100% { opacity: 0.6; }
                    50% { opacity: 1.0; }
                }
                
                @keyframes iconChange {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1.1); }
                }
                
                .toggle-knob {
                    transition: transform 300ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .toggle-track {
                    transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
                }
                
                .toggle-icon {
                    transition: all 200ms ease-out;
                }
                
                .toggle-label {
                    transition: all 200ms ease-in-out;
                }
                
                .bell-glow {
                    animation: glowPulse 2s ease-in-out infinite;
                }
                
                .reminder-toggle:hover {
                    transform: scale(1.02);
                }
                
                .reminder-toggle:active {
                    transform: scale(0.98);
                }
            `}</style>

            <div
                className="reminder-toggle flex items-center gap-3 cursor-pointer select-none transition-transform duration-150"
                onClick={handleClick}
                onKeyDown={handleKeyDown}
                role="switch"
                aria-checked={isActive}
                aria-label={`Set reminder for ${eventName}`}
                tabIndex={0}
            >
                {/* Bell Icon */}
                <div
                    className="toggle-icon flex-shrink-0"
                    style={{
                        color: isActive ? '#00D9FF' : '#888888',
                        filter: isActive ? 'drop-shadow(0px 0px 12px rgba(0, 217, 255, 0.4))' : 'none',
                    }}
                >
                    {isActive ? (
                        <BellRing size={20} className="bell-glow" />
                    ) : (
                        <Bell size={20} />
                    )}
                </div>

                {/* Toggle Switch */}
                <div
                    className="toggle-track relative flex-shrink-0"
                    style={{
                        width: '44px',
                        height: '24px',
                        borderRadius: '12px',
                        background: isActive
                            ? 'linear-gradient(135deg, #00D9FF 0%, #0099CC 100%)'
                            : 'rgba(255, 255, 255, 0.1)',
                        border: isActive
                            ? '1px solid rgba(0, 217, 255, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.2)',
                        boxShadow: isActive
                            ? '0px 0px 16px rgba(0, 217, 255, 0.3)'
                            : 'none',
                    }}
                >
                    {/* Knob */}
                    <div
                        className="toggle-knob absolute top-1/2 -translate-y-1/2"
                        style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            background: isActive ? '#FFFFFF' : '#666666',
                            boxShadow: isActive
                                ? '0px 2px 8px rgba(0, 217, 255, 0.4)'
                                : '0px 2px 4px rgba(0, 0, 0, 0.3)',
                            left: isActive ? '22.5px' : '2.5px',
                        }}
                    />
                </div>

                {/* Label */}
                <div
                    className="toggle-label text-[14px] font-medium"
                    style={{
                        color: isActive ? '#00D9FF' : '#AAAAAA',
                        fontWeight: isActive ? 600 : 500,
                    }}
                >
                    {isActive ? 'Reminder Set' : 'Remind Me'}
                </div>
            </div>
        </>
    );
}
