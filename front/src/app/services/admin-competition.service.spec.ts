import { TestBed } from '@angular/core/testing';

import { AdminCompetitionService } from './admin-competition.service';

describe('AdminCompetitionService', () => {
  let service: AdminCompetitionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminCompetitionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
