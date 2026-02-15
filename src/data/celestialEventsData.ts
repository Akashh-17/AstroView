/**
 * celestialEventsData.ts
 *
 * Static mock data for location-based celestial events.
 * Separated by hemisphere. No API dependency.
 */

export type VisibilityLevel = 'High' | 'Moderate' | 'Low';

export interface CelestialEvent {
    id: string;
    name: string;
    date: string;
    visibility: VisibilityLevel;
    description: string;
    icon: 'meteor' | 'moon' | 'eclipse' | 'planet' | 'comet' | 'aurora';
}

export const NORTHERN_HEMISPHERE_EVENTS: CelestialEvent[] = [
    {
        id: 'n1',
        name: 'Perseid Meteor Shower',
        date: 'August 12–13, 2026',
        visibility: 'High',
        description: 'Earth passes through comet debris, producing up to 100 shooting stars per hour. Best seen after midnight from a dark location, looking northeast.',
        icon: 'meteor',
    },
    {
        id: 'n2',
        name: 'Partial Lunar Eclipse',
        date: 'September 7, 2026',
        visibility: 'Moderate',
        description: 'The Moon drifts through part of Earth\'s shadow, causing one side to darken visibly. No equipment needed — just look up at the full Moon.',
        icon: 'eclipse',
    },
    {
        id: 'n3',
        name: 'Jupiter at Opposition',
        date: 'October 3, 2026',
        visibility: 'High',
        description: 'Jupiter reaches its closest point to Earth, appearing as the brightest "star" in the sky. With binoculars, you can spot its four largest moons.',
        icon: 'planet',
    },
    {
        id: 'n4',
        name: 'Geminid Meteor Shower',
        date: 'December 13–14, 2026',
        visibility: 'High',
        description: 'The strongest meteor shower of the year, producing up to 120 colorful streaks per hour. Best viewed after 10 PM from any dark sky location.',
        icon: 'meteor',
    },
];

export const SOUTHERN_HEMISPHERE_EVENTS: CelestialEvent[] = [
    {
        id: 's1',
        name: 'Eta Aquariid Meteor Shower',
        date: 'May 6–7, 2026',
        visibility: 'High',
        description: 'Debris from Halley\'s Comet creates a fast-moving shower of up to 60 meteors per hour. Best observed in the hour before dawn, facing east.',
        icon: 'meteor',
    },
    {
        id: 's2',
        name: 'Total Lunar Eclipse',
        date: 'March 14, 2026',
        visibility: 'High',
        description: 'The Moon turns a deep red as Earth\'s shadow covers it completely. This "Blood Moon" lasts over an hour and is visible without any equipment.',
        icon: 'eclipse',
    },
    {
        id: 's3',
        name: 'Saturn at Opposition',
        date: 'September 21, 2026',
        visibility: 'Moderate',
        description: 'Saturn shines at its brightest, appearing as a steady golden point in the east after sunset. A small telescope will reveal its iconic rings.',
        icon: 'planet',
    },
    {
        id: 's4',
        name: 'Southern Taurid Fireballs',
        date: 'November 5, 2026',
        visibility: 'Low',
        description: 'A slow, sparse shower known for occasional bright fireballs. Only 5–10 meteors per hour, but individual streaks can be dramatic.',
        icon: 'meteor',
    },
];
