import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationDetail } from './station-detail';

describe('StationDetail', () => {
  let component: StationDetail;
  let fixture: ComponentFixture<StationDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StationDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StationDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
