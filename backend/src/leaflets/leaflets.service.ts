import { Injectable } from '@nestjs/common';

@Injectable()
export class LeafletsService {
  private readonly leaflets = [
    { id: 'b1', store: 'biedronka', title: 'Codziennie Niskie Ceny', validFrom: '08.06', validTo: '13.06', pages: 4 },
    { id: 'l1', store: 'lidl', title: 'Tylko w Lidl', validFrom: '08.06', validTo: '10.06', pages: 3 },
    { id: 'k1', store: 'kaufland', title: 'Gazetka Kaufland', validFrom: '04.06', validTo: '10.06', pages: 4 }
  ];

  findAll() {
    return this.leaflets;
  }
}
