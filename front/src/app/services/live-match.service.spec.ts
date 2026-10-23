import { TestBed } from '@angular/core/testing';

import { LiveMatchService } from './live-match.service';

describe('LiveMatchService', () => {
  let service: LiveMatchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LiveMatchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
