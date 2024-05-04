import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { OrderPaginationDto } from './dto/order-pagination.dto';
import { ChangeOrderStatusDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('OrdersService')

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto
    });
  }

  async findAll(orderPaginatrionDto: OrderPaginationDto) {
    const totalPages = await this.order.count({
      where: {
        status: orderPaginatrionDto.status
      }
    });
    const currentPage = orderPaginatrionDto.page;
    const perPage = orderPaginatrionDto.limit;

    return {
      data: await this.order.findMany({
        skip: ( currentPage - 1 ) * perPage,
        take: perPage,
        where: {
          status: orderPaginatrionDto.status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil( totalPages / perPage)
      }
    }
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id }
    });

    if(!order){
      throw new RpcException({
        message: `Order with id #${id} - not found`,
        status: HttpStatus.NOT_FOUND
      });
    }

    return order;

  }

  async changeStatus( changeOrderStatus: ChangeOrderStatusDto ){

    const { id, status } = changeOrderStatus;

    const order = await this.findOne(id);
    if (order.status === status) {
      return order;
    }

    return this.order.update({
      where: { id },
      data: { status: status }
    });
  }

}
