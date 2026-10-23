import { TestBed } from '@angular/core/testing';

import { PublicStandingsService } from './public-standings.service';

describe('PublicStandingsService', () => {
  let service: PublicStandingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicStandingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
