import { TestBed } from '@angular/core/testing';

import { AdminMatchService } from './admin-match.service';

describe('AdminMatchService', () => {
  let service: AdminMatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminMatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
