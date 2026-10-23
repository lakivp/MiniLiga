import { TestBed } from '@angular/core/testing';

import { PublicLiveMatchService } from './public-live-match.service';

describe('PublicLiveMatchService', () => {
  let service: PublicLiveMatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicLiveMatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
