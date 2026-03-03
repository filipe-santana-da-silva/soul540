import type { PizzaEvent } from '../entities/Event';

export interface IEventRepository {
  getAll(): PizzaEvent[];
  getById(id: string): PizzaEvent | undefined;
  create(event: PizzaEvent): void;
  update(id: string, data: Partial<PizzaEvent>): void;
  delete(id: string): void;
}
