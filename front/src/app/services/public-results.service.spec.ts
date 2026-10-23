import { TestBed } from '@angular/core/testing';

import { PublicResultsService } from './public-results.service';

describe('PublicResultsService', () => {
  let service: PublicResultsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PublicResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
