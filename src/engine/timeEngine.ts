/**
 * timeEngine.ts
 *
 * Julian Date utilities and time conversion for the simulation.
 *
 * The Julian Date (JD) is a continuous count of days since the beginning
 * of the Julian Period (January 1, 4713 BC). It's the standard time
 * representation used in astronomy.
 *
 * J2000.0 epoch: January 1, 2000 at 12:00 TT = JD 2451545.0
 */

/**
 * J2000.0 epoch in Julian Date.
 */
export const J2000 = 2451545.0;

/**
 * Convert a JavaScript Date to Julian Date.
 *
 * Algorithm from Meeus, "Astronomical Algorithms" 2nd ed, Ch. 7.
 *
 * @param date JavaScript Date object (UTC)
 * @returns Julian Date as a floating-point number
 */
export function dateToJulianDate(date: Date): number {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1; // JS months are 0-indexed
    const day = date.getUTCDate();
    const hour = date.getUTCHours();
    const minute = date.getUTCMinutes();
    const second = date.getUTCSeconds();

    // Fractional day
    const dayFraction = day + (hour + minute / 60 + second / 3600) / 24;

    // Adjust year/month for the algorithm (Jan/Feb are month 13/14 of previous year)
    let y = year;
    let m = month;
    if (m <= 2) {
        y -= 1;
        m += 12;
    }

    // Gregorian calendar correction
    const A = Math.floor(y / 100);
    const B = 2 - A + Math.floor(A / 4);

    // Julian Date formula
    const JD =
        Math.floor(365.25 * (y + 4716)) +
        Math.floor(30.6001 * (m + 1)) +
        dayFraction +
        B -
        1524.5;

    return JD;
}

/**
 * Convert a Julian Date back to a JavaScript Date (UTC).
 *
 * Inverse of dateToJulianDate, following Meeus Ch. 7.
 *
 * @param jd Julian Date
 * @returns JavaScript Date object (UTC)
 */
export function julianDateToDate(jd: number): Date {
    // Add 0.5 to shift from noon to midnight
    const z = Math.floor(jd + 0.5);
    const f = jd + 0.5 - z;

    let A: number;
    if (z < 2299161) {
        A = z;
    } else {
        const alpha = Math.floor((z - 1867216.25) / 36524.25);
        A = z + 1 + alpha - Math.floor(alpha / 4);
    }

    const B = A + 1524;
    const C = Math.floor((B - 122.1) / 365.25);
    const D = Math.floor(365.25 * C);
    const E = Math.floor((B - D) / 30.6001);

    // Day with fractional part
    const dayWithFraction = B - D - Math.floor(30.6001 * E) + f;
    const day = Math.floor(dayWithFraction);
    const dayFrac = dayWithFraction - day;

    // Month
    let month: number;
    if (E < 14) {
        month = E - 1;
    } else {
        month = E - 13;
    }

    // Year
    let year: number;
    if (month > 2) {
        year = C - 4716;
    } else {
        year = C - 4715;
    }

    // Extract hours, minutes, seconds from day fraction
    const totalHours = dayFrac * 24;
    const hours = Math.floor(totalHours);
    const totalMinutes = (totalHours - hours) * 60;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.floor((totalMinutes - minutes) * 60);

    return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
}

/**
 * Get the current real-world Julian Date.
 */
export function currentJulianDate(): number {
    return dateToJulianDate(new Date());
}

/**
 * Format a Julian Date as a human-readable string.
 *
 * @param jd Julian Date
 * @returns Formatted date string like "2024 Jan 15 12:30"
 */
export function formatJulianDate(jd: number): string {
    const date = julianDateToDate(jd);
    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const year = date.getUTCFullYear();
    const month = months[date.getUTCMonth()];
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');

    return `${year} ${month} ${day} ${hours}:${minutes} UTC`;
}

/**
 * Convert Julian Date to Julian centuries since J2000.0.
 * Used in some astronomical calculations.
 *
 * @param jd Julian Date
 * @returns Julian centuries since J2000.0
 */
export function julianCenturies(jd: number): number {
    return (jd - J2000) / 36525.0;
}
