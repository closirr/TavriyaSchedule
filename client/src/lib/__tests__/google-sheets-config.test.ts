import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateGoogleSheetsUrl } from '../google-sheets-config';

/**
 * **Feature: static-site-migration, Property 6: Google Sheets URL Validation**
 * **Validates: Requirements 5.3**
 * 
 * For any string input, the URL validator should return true only for strings
 * that match the Google Sheets public CSV export URL pattern.
 */
describe('Google Sheets Config', () => {
  describe('validateGoogleSheetsUrl', () => {
    // Valid Google Sheets URL patterns for testing
    const validSpreadsheetIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{20,50}$/);
    
    // Generator for valid export URLs
    const validExportUrlArb = validSpreadsheetIdArb.map(
      id => `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`
    );
    
    // Generator for valid gviz URLs
    const validGvizUrlArb = validSpreadsheetIdArb.map(
      id => `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`
    );
    
    // Generator for valid pub URLs
    const validPubUrlArb = validSpreadsheetIdArb.map(
      id => `https://docs.google.com/spreadsheets/d/${id}/pub?output=csv`
    );
    
    // Combined valid URL generator
    const validGoogleSheetsUrlArb = fc.oneof(
      validExportUrlArb,
      validGvizUrlArb,
      validPubUrlArb
    );

    /**
     * Property: All valid Google Sheets CSV export URLs should be accepted
     */
    it('should accept all valid Google Sheets CSV export URLs', () => {
      fc.assert(
        fc.property(validGoogleSheetsUrlArb, (url) => {
          return validateGoogleSheetsUrl(url) === true;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: Random strings that don't match the pattern should be rejected
     */
    it('should reject arbitrary strings that are not Google Sheets URLs', () => {
      const nonGoogleUrlArb = fc.string().filter(s => {
        // Filter out strings that accidentally match the pattern
        return !s.includes('docs.google.com/spreadsheets');
      });

      fc.assert(
        fc.property(nonGoogleUrlArb, (url) => {
          return validateGoogleSheetsUrl(url) === false;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * Property: URLs with wrong domain should be rejected
     */
    it('should reject URLs with wrong domain', () => {
      const wrongDomainArb = fc.constantFrom(
        'https://google.com/spreadsheets/d/abc123/export?format=csv',
        'https://sheets.google.com/spreadsheets/d/abc123/export?format=csv',
        'https://drive.google.com/spreadsheets/d/abc123/export?format=csv',
        'http://docs.google.com/spreadsheets/d/abc123/export?format=csv', // http instead of https
      );

      fc.assert(
        fc.property(wrongDomainArb, (url) => {
          return validateGoogleSheetsUrl(url) === false;
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property: Empty and null-like inputs should be rejected
     */
    it('should reject empty and null-like inputs', () => {
      const emptyInputArb = fc.constantFrom('', '   ', '\t', '\n');

      fc.assert(
        fc.property(emptyInputArb, (input) => {
          return validateGoogleSheetsUrl(input) === false;
        }),
        { numRuns: 10 }
      );
    });

    /**
     * Property: URLs with wrong export format should be rejected
     */
    it('should reject URLs with wrong export format', () => {
      const wrongFormatArb = validSpreadsheetIdArb.chain(id => 
        fc.constantFrom(
          `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
          `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`,
          `https://docs.google.com/spreadsheets/d/${id}/edit`,
          `https://docs.google.com/spreadsheets/d/${id}`,
        )
      );

      fc.assert(
        fc.property(wrongFormatArb, (url) => {
          return validateGoogleSheetsUrl(url) === false;
        }),
        { numRuns: 100 }
      );
    });

    // Unit tests for specific known cases
    describe('unit tests', () => {
      it('should accept valid export URL', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv';
        expect(validateGoogleSheetsUrl(url)).toBe(true);
      });

      it('should accept valid gviz URL', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/gviz/tq?tqx=out:csv';
        expect(validateGoogleSheetsUrl(url)).toBe(true);
      });

      it('should accept valid pub URL', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/pub?output=csv';
        expect(validateGoogleSheetsUrl(url)).toBe(true);
      });

      it('should accept URL with gid parameter', () => {
        const url = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/export?format=csv&gid=0';
        expect(validateGoogleSheetsUrl(url)).toBe(true);
      });

      it('should reject null', () => {
        expect(validateGoogleSheetsUrl(null as any)).toBe(false);
      });

      it('should reject undefined', () => {
        expect(validateGoogleSheetsUrl(undefined as any)).toBe(false);
      });
    });
  });
});
