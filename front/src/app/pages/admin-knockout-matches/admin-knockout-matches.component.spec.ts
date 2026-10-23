import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminKnockoutMatchesComponent } from './admin-knockout-matches.component';

describe('AdminKnockoutMatchesComponent', () => {
  let component: AdminKnockoutMatchesComponent;
  let fixture: ComponentFixture<AdminKnockoutMatchesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminKnockoutMatchesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminKnockoutMatchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
