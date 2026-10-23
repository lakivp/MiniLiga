import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMatchLineupComponent } from './admin-match-lineup.component';

describe('AdminMatchLineupComponent', () => {
  let component: AdminMatchLineupComponent;
  let fixture: ComponentFixture<AdminMatchLineupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMatchLineupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMatchLineupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
