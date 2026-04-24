export interface Ward {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
}

export interface District {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  short_codename: string;
  wards?: Ward[];
}

export interface Province {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
  districts?: District[];
}
