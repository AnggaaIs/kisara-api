import { EntityRepository } from "@mikro-orm/postgresql";
import { FilterQuery } from "@mikro-orm/core";

export class BaseRepository<T extends object> {
  constructor(public readonly repository: EntityRepository<T>) {}

  async findAll(options?: { limit?: number; offset?: number }): Promise<T[]> {
    return this.repository.findAll({
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  async findOne(where: FilterQuery<T>): Promise<T | null> {
    return this.repository.findOne(where);
  }

  async findById(id: any): Promise<T | null> {
    return this.repository.findOne({ id } as FilterQuery<T>);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as T);
    await this.repository.getEntityManager().persistAndFlush(entity);
    return entity;
  }

  async update(id: any, data: Partial<T>): Promise<T | null> {
    const entity = await this.findById(id);
    if (!entity) return null;

    Object.assign(entity, data);
    await this.repository.getEntityManager().flush();
    return entity;
  }

  async delete(id: any): Promise<boolean> {
    const entity = await this.findById(id);
    if (!entity) return false;

    await this.repository.getEntityManager().removeAndFlush(entity);
    return true;
  }

  async count(where?: FilterQuery<T>): Promise<number> {
    return this.repository.count(where);
  }

  async save(entity: T): Promise<void> {
    await this.repository.getEntityManager().persistAndFlush(entity);
  }
}
