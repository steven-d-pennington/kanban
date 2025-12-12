import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { RadioGroup } from '../components/ui/RadioGroup';
import { Card } from '../components/ui/Card';

expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Button Component Accessibility', () => {
    it('should have no accessibility violations for default button', async () => {
      const { container } = render(
        <Button>Click me</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for disabled button', async () => {
      const { container } = render(
        <Button disabled>Disabled Button</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for button with aria-label', async () => {
      const { container } = render(
        <Button aria-label="Close dialog">×</Button>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for button variants', async () => {
      const { container } = render(
        <div>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for button sizes', async () => {
      const { container } = render(
        <div>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Input Component Accessibility', () => {
    it('should have no accessibility violations for input with label', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-input">Test Input</Label>
          <Input id="test-input" placeholder="Enter text" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for required input', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="required-input">Required Input *</Label>
          <Input id="required-input" required aria-required="true" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for input with error state', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="error-input">Error Input</Label>
          <Input 
            id="error-input" 
            aria-invalid="true" 
            aria-describedby="error-message"
          />
          <div id="error-message" role="alert">
            This field is required
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for different input types', async () => {
      const { container } = render(
        <div>
          <div>
            <Label htmlFor="email-input">Email</Label>
            <Input id="email-input" type="email" />
          </div>
          <div>
            <Label htmlFor="password-input">Password</Label>
            <Input id="password-input" type="password" />
          </div>
          <div>
            <Label htmlFor="number-input">Number</Label>
            <Input id="number-input" type="number" />
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Textarea Component Accessibility', () => {
    it('should have no accessibility violations for textarea with label', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-textarea">Comments</Label>
          <Textarea id="test-textarea" placeholder="Enter your comments" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for required textarea', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="required-textarea">Required Textarea *</Label>
          <Textarea 
            id="required-textarea" 
            required 
            aria-required="true"
            maxLength={500}
          />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Select Component Accessibility', () => {
    it('should have no accessibility violations for select with label', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="test-select">Choose Option</Label>
          <Select id="test-select">
            <option value="">Select an option</option>
            <option value="option1">Option 1</option>
            <option value="option2">Option 2</option>
          </Select>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for select with optgroups', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="grouped-select">Categories</Label>
          <Select id="grouped-select">
            <optgroup label="Fruits">
              <option value="apple">Apple</option>
              <option value="banana">Banana</option>
            </optgroup>
            <optgroup label="Vegetables">
              <option value="carrot">Carrot</option>
              <option value="lettuce">Lettuce</option>
            </optgroup>
          </Select>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Checkbox Component Accessibility', () => {
    it('should have no accessibility violations for checkbox with label', async () => {
      const { container } = render(
        <div>
          <Checkbox id="test-checkbox" />
          <Label htmlFor="test-checkbox">Accept terms</Label>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for checkbox group', async () => {
      const { container } = render(
        <fieldset>
          <legend>Select your interests</legend>
          <div>
            <Checkbox id="sports" />
            <Label htmlFor="sports">Sports</Label>
          </div>
          <div>
            <Checkbox id="music" />
            <Label htmlFor="music">Music</Label>
          </div>
          <div>
            <Checkbox id="movies" />
            <Label htmlFor="movies">Movies</Label>
          </div>
        </fieldset>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('RadioGroup Component Accessibility', () => {
    it('should have no accessibility violations for radio group', async () => {
      const { container } = render(
        <fieldset>
          <legend>Choose your preferred contact method</legend>
          <RadioGroup name="contact">
            <div>
              <input type="radio" id="email" name="contact" value="email" />
              <Label htmlFor="email">Email</Label>
            </div>
            <div>
              <input type="radio" id="phone" name="contact" value="phone" />
              <Label htmlFor="phone">Phone</Label>
            </div>
            <div>
              <input type="radio" id="mail" name="contact" value="mail" />
              <Label htmlFor="mail">Mail</Label>
            </div>
          </RadioGroup>
        </fieldset>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Component Accessibility', () => {
    it('should have no accessibility violations for card with content', async () => {
      const { container } = render(
        <Card>
          <h2>Card Title</h2>
          <p>Card description content goes here.</p>
          <Button>Action</Button>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for interactive card', async () => {
      const { container } = render(
        <Card 
          role="button" 
          tabIndex={0}
          aria-label="Click to view details"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              // Handle click
            }
          }}
        >
          <h3>Interactive Card</h3>
          <p>This card can be clicked or activated with keyboard.</p>
        </Card>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Complex Form Accessibility', () => {
    it('should have no accessibility violations for complete form', async () => {
      const { container } = render(
        <form>
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input id="name" required aria-required="true" />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input id="email" type="email" required aria-required="true" />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" />
          </div>
          
          <fieldset>
            <legend>Preferred Contact Method</legend>
            <div>
              <input type="radio" id="contact-email" name="contact" value="email" />
              <Label htmlFor="contact-email">Email</Label>
            </div>
            <div>
              <input type="radio" id="contact-phone" name="contact" value="phone" />
              <Label htmlFor="contact-phone">Phone</Label>
            </div>
          </fieldset>
          
          <div>
            <Label htmlFor="country">Country</Label>
            <Select id="country">
              <option value="">Select a country</option>
              <option value="us">United States</option>
              <option value="ca">Canada</option>
              <option value="uk">United Kingdom</option>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" rows={4} />
          </div>
          
          <div>
            <Checkbox id="newsletter" />
            <Label htmlFor="newsletter">Subscribe to newsletter</Label>
          </div>
          
          <div>
            <Checkbox id="terms" required />
            <Label htmlFor="terms">I agree to the terms and conditions *</Label>
          </div>
          
          <Button type="submit">Submit Form</Button>
        </form>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Focus Management', () => {
    it('should have no accessibility violations with focus indicators', async () => {
      const user = userEvent.setup();
      const { container } = render(
        <div>
          <Button>First Button</Button>
          <Input placeholder="Input field" />
          <Button>Second Button</Button>
        </div>
      );

      // Test tab navigation
      await user.tab();
      await user.tab();
      await user.tab();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have no accessibility violations with proper ARIA usage', async () => {
      const { container } = render(
        <div>
          <Button aria-expanded="false" aria-controls="menu">
            Menu
          </Button>
          <div id="menu" role="menu" aria-hidden="true">
            <div role="menuitem">Item 1</div>
            <div role="menuitem">Item 2</div>
          </div>
          
          <div role="alert" aria-live="polite">
            Status message
          </div>
          
          <div 
            role="progressbar" 
            aria-valuenow={50} 
            aria-valuemin={0} 
            aria-valuemax={100}
            aria-label="Upload progress"
          >
            50% complete
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Semantic HTML', () => {
    it('should have no accessibility violations with proper semantic structure', async () => {
      const { container } = render(
        <main>
          <header>
            <h1>Page Title</h1>
            <nav aria-label="Main navigation">
              <ul>
                <li><a href="#section1">Section 1</a></li>
                <li><a href="#section2">Section 2</a></li>
              </ul>
            </nav>
          </header>
          
          <article>
            <header>
              <h2>Article Title</h2>
              <time dateTime="2024-01-01">January 1, 2024</time>
            </header>
            <p>Article content goes here.</p>
          </article>
          
          <aside>
            <h3>Related Links</h3>
            <ul>
              <li><a href="#">Link 1</a></li>
              <li><a href="#">Link 2</a></li>
            </ul>
          </aside>
          
          <footer>
            <p>&copy; 2024 Company Name</p>
          </footer>
        </main>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Error Handling', () => {
    it('should have no accessibility violations with error messages', async () => {
      const { container } = render(
        <div>
          <Label htmlFor="error-field">Required Field *</Label>
          <Input 
            id="error-field"
            aria-invalid="true"
            aria-describedby="error-message"
          />
          <div id="error-message" role="alert" aria-live="polite">
            This field is required and cannot be empty.
          </div>
        </div>
      );

      const results = await