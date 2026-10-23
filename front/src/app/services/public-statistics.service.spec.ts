import { TestBed } from '@angular/core/testing';

import { PublicStatisticsService } from './public-statistics.service';

describe('PublicStatisticsService', () => {
  let service: PublicStatisticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicStatisticsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
