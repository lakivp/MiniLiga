import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGroupComponent } from './admin-group.component';

describe('AdminGroupComponent', () => {
  let component: AdminGroupComponent;
  let fixture: ComponentFixture<AdminGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
