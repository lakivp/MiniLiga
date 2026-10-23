import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminNewMatchComponent } from './admin-new-match.component';

describe('AdminNewMatchComponent', () => {
  let component: AdminNewMatchComponent;
  let fixture: ComponentFixture<AdminNewMatchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminNewMatchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminNewMatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
