import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusteriSiparislerComponent } from './musteri-siparisler.component';

describe('MusteriSiparislerComponent', () => {
  let component: MusteriSiparislerComponent;
  let fixture: ComponentFixture<MusteriSiparislerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MusteriSiparislerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MusteriSiparislerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
