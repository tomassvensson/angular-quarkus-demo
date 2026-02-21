import { TestBed } from '@angular/core/testing';
import { HomePageComponent } from './home-page.component';
import { SocialService } from '../services/social.service';
import { of, throwError } from 'rxjs';

describe('HomePageComponent', () => {
  let socialServiceMock: any;

  beforeEach(async () => {
    socialServiceMock = {
      getReadme: vi.fn().mockReturnValue(throwError(() => new Error('Not available')))
    };

    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [
        { provide: SocialService, useValue: socialServiceMock }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render welcome heading as fallback when readme fails', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Welcome');
  });

  it('should display technologies as fallback', () => {
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const pills = compiled.querySelectorAll('.tech-pill');
    expect(pills.length).toBeGreaterThan(0);
    const texts = Array.from(pills).map((el) => el.textContent);
    expect(texts).toContain('Angular');
    expect(texts).toContain('Quarkus');
  });

  it('should render markdown content when readme loads', async () => {
    socialServiceMock.getReadme.mockReturnValue(of('# Test Heading'));
    const fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    
    // Wait for the async dynamic import of 'marked' and rendering
    await fixture.whenStable();
    // The dynamic import + async marked() needs extra time in test environments
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      fixture.detectChanges();
      if (fixture.nativeElement.querySelector('.markdown-body')) break;
    }
    
    const compiled = fixture.nativeElement as HTMLElement;
    const markdownBody = compiled.querySelector('.markdown-body');
    expect(markdownBody).toBeTruthy();
    expect(markdownBody?.innerHTML).toContain('Test Heading');
  });
});
