import { ulid } from "ulid";

/**
 * Generate a new ULID (Universally Unique Lexicographically Sortable Identifier).
 * ULIDs are 26-character strings that are sortable by generation time.
 * 
 * @returns A new ULID string (e.g., "01H2...3ZK")
 */
export function generateULID(): string {
    return ulid();
}

/**
 * Validate if a string is a valid ULID format.
 * ULID format: 26 characters, base32 (Crockford's), time-prefixed.
 * 
 * @param ulidStr The string to validate
 * @returns True if valid ULID format
 */
export function isValidULID(ulidStr: string): boolean {
    // Basic format check: 26 chars, base32 alphabet
    const ulidRegex = /^[0-9ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstuvwxyz]{26}$/;
    return ulidRegex.test(ulidStr);
}

/**
 * Extract timestamp from a ULID (first 10 chars = 48 bits of time).
 * 
 * @param ulidStr The ULID to parse
 * @returns Date object (null if invalid)
 */
export function extractTimestamp(ulidStr: string): Date | null {
    if (!isValidULID(ulidStr)) {
        return null;
    }
    
    const timeStr = ulidStr.substring(0, 10);
    const time = parseInt(timeStr, 32); // base32 to decimal
    return new Date(time);
}
