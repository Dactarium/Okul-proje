import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SiparislerComponent } from './siparisler.component';

describe('SiparislerComponent', () => {
  let component: SiparislerComponent;
  let fixture: ComponentFixture<SiparislerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SiparislerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SiparislerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
