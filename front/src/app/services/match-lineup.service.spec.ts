import { TestBed } from '@angular/core/testing';

import { MatchLineupService } from './match-lineup.service';

describe('MatchLineupService', () => {
  let service: MatchLineupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchLineupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
