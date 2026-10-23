import { TestBed } from '@angular/core/testing';

import { AdminGroupService } from './admin-group.service';

describe('AdminGroupService', () => {
  let service: AdminGroupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminGroupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
