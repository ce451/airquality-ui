import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dashbaord } from './dashbaord';

describe('Dashbaord', () => {
  let component: Dashbaord;
  let fixture: ComponentFixture<Dashbaord>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [Dashbaord]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dashbaord);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
