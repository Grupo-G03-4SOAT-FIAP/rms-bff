import { ClienteModel } from 'src/infrastructure/sql/models/cliente.model';
import { ClienteEntity } from '../entities/cliente.entity';

export interface IClienteRepository {
  criarCliente(cliente: ClienteEntity): Promise<ClienteModel>;
  editarCliente(
    clienteId: string,
    cliente: ClienteEntity,
  ): Promise<ClienteModel | null>;
  excluirCliente(clienteId: string): Promise<void>;
  buscarClientePorId(clienteId: string): Promise<ClienteModel | null>;
  buscarClientePorCPF(cpfCliente: string): Promise<ClienteModel | null>;
  buscarClientePorEmail(emailCliente: string): Promise<ClienteModel | null>;
  listarClientes(): Promise<ClienteModel[] | []>;
}

export const IClienteRepository = Symbol('IClienteRepository');