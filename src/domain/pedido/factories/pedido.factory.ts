import { Inject, Injectable } from '@nestjs/common';
import { IPedidoFactory } from '../interfaces/pedido.factory.port';
import { PedidoService } from '../services/pedido.service';
import { IClienteRepository } from '../../../domain/cliente/interfaces/cliente.repository.port';
import { IProdutoRepository } from '../../../domain/produto/interfaces/produto.repository.port';
import { CriaItemPedidoDTO } from '../../../presentation/rest/v1/presenters/pedido/item_pedido.dto';
import { ItemPedidoEntity } from '../entities/item_pedido.entity';
import { ProdutoNaoLocalizadoErro } from '../../../domain/produto/exceptions/produto.exception';
import { ClienteEntity } from '../../../domain/cliente/entities/cliente.entity';
import { ClienteNaoLocalizadoErro } from '../../../domain/cliente/exceptions/cliente.exception';
import { CriaPedidoDTO } from '../../../presentation/rest/v1/presenters/pedido/pedido.dto';
import { PedidoEntity } from '../entities/pedido.entity';
import { StatusPedido } from '../enums/pedido.enum';

@Injectable()
export class PedidoFactory implements IPedidoFactory {
  constructor(
    private readonly pedidoService: PedidoService,
    @Inject(IClienteRepository)
    private readonly clienteRepository: IClienteRepository,
    @Inject(IProdutoRepository)
    private readonly produtoRepository: IProdutoRepository,
  ) {}

  async criarItemPedido(
    itens: CriaItemPedidoDTO[],
  ): Promise<ItemPedidoEntity[]> {
    const itensPedido = await Promise.all(
      itens.map(async (item) => {
        const produto = await this.produtoRepository.buscarProdutoPorId(
          item.produto,
        );
        if (!produto) {
          throw new ProdutoNaoLocalizadoErro(
            `Produto informado não existe ${item.produto}`,
          );
        }

        const itemPedidoEntity = new ItemPedidoEntity(produto, item.quantidade);
        return itemPedidoEntity;
      }),
    );
    return itensPedido;
  }

  async criarEntidadeCliente(
    cpfCliente?: string,
  ): Promise<ClienteEntity | null> {
    const cliente =
      await this.clienteRepository.buscarClientePorCPF(cpfCliente);
    if (!cliente) {
      throw new ClienteNaoLocalizadoErro('Cliente informado não existe');
    }
    return cliente;
  }

  async criarEntidadePedido(pedido: CriaPedidoDTO): Promise<PedidoEntity> {
    const numeroPedido = this.pedidoService.gerarNumeroPedido();
    const itensPedido = await this.criarItemPedido(pedido.itensPedido);

    let clienteEntity = null;
    if (pedido.cpfCliente) {
      clienteEntity = await this.criarEntidadeCliente(pedido.cpfCliente);

      return new PedidoEntity(
        itensPedido,
        StatusPedido.RECEBIDO,
        numeroPedido,
        false,
        clienteEntity,
      );
    }

    return new PedidoEntity(
      itensPedido,
      StatusPedido.RECEBIDO,
      numeroPedido,
      false,
    );
  }
}
