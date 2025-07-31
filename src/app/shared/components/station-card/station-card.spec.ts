import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StationCard } from './station-card';

describe('StationCard', () => {
  let component: StationCard;
  let fixture: ComponentFixture<StationCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StationCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StationCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
