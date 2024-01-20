import { Test, TestingModule } from '@nestjs/testing';
import { ICategoriaRepository } from '../../../domain/ports/categoria/categoria.repository.port';
import { CategoriaUseCase } from './categoria.use_case';
import {
  AtualizaCategoriaDTO,
  CategoriaDTO,
} from 'src/adapters/inbound/rest/v1/presenters/categoria.dto';
import {
  CategoriaDuplicadaErro,
  CategoriaNaoLocalizadaErro,
} from '../../../domain/exceptions/categoria.exception';
import { ICategoriaFactory } from 'src/domain/ports/categoria/categoria.factory.port';
import { CategoriaEntity } from 'src/domain/entities/categoria/categoria.entity';
import { ICategoriaDTOFactory } from 'src/domain/ports/categoria/categoria.dto.factory.port';
import {
  novaCategoriaDTO,
  categoriaAtualizadaModelMock,
  listaCategoriasModel,
  makeCriaCategoriaDTO,
  novaCategoriaModelMock,
  categoriaModelMock,
  makeCategoriaDTO,
} from 'src/mocks/categoria.mock';

describe('Categoria Use case', () => {
  let categoriaUseCase: CategoriaUseCase;
  let categoriaRepository: ICategoriaRepository;
  let categoriaFactory: ICategoriaFactory;
  let categoriaDTOFactory: ICategoriaDTOFactory;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriaUseCase,
        {
          provide: ICategoriaRepository,
          useValue: {
            buscarCategoriaPorNome: jest.fn(),
            buscarCategoriaPorId: jest.fn(),
            criarCategoria: jest.fn(),
            editarCategoria: jest.fn(),
            excluirCategoria: jest.fn(),
            listarCategorias: jest.fn(),
          },
        },
        {
          provide: ICategoriaFactory,
          useValue: {
            criarEntidadeCategoriaFromCriaCategoriaDTO: jest.fn(),
            criarEntidadeCategoriaFromAtualizaCategoriaDTO: jest.fn(),
          },
        },
        {
          provide: ICategoriaDTOFactory,
          useValue: {
            criarCategoriaDTO: jest.fn(),
            criarListaCategoriaDTO: jest.fn(),
          },
        },
      ],
    }).compile();
    categoriaUseCase = module.get<CategoriaUseCase>(CategoriaUseCase);
    categoriaRepository =
      module.get<ICategoriaRepository>(ICategoriaRepository);
    categoriaFactory = module.get<ICategoriaFactory>(ICategoriaFactory);
    categoriaDTOFactory =
      module.get<ICategoriaDTOFactory>(ICategoriaDTOFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Deve ter uma definição para Categoria Use Case, Categoria Repository e Categoria Factory', async () => {
    expect(categoriaUseCase).toBeDefined();
    expect(categoriaRepository).toBeDefined();
    expect(categoriaFactory).toBeDefined();
    expect(categoriaDTOFactory).toBeDefined();
  });

  describe('Criar categoria', () => {
    it('Deve ser lançado um erro ao tentar criar uma categoria com um nome já registrado no sistema', async () => {
      // Arrange

      const categoriaDto = makeCategoriaDTO(
        '0a14aa4e-75e7-405f-8601-81f60646c93d',
        'lanche',
        'lanche x tudo',
      );
      const criaCategoriaDTO = makeCriaCategoriaDTO(
        categoriaDto.nome,
        categoriaDto.descricao,
      );
      const categoriaEntity = new CategoriaEntity(
        criaCategoriaDTO.nome,
        criaCategoriaDTO.descricao,
      );

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorNome')
        .mockReturnValue(Promise.resolve(categoriaModelMock));

      jest
        .spyOn(categoriaFactory, 'criarEntidadeCategoriaFromCriaCategoriaDTO')
        .mockReturnValue(categoriaEntity);

      // Act
      // Assert

      expect(categoriaUseCase.criarCategoria(criaCategoriaDTO)).rejects.toThrow(
        new CategoriaDuplicadaErro('Existe uma categoria com esse nome'),
      );

      expect(categoriaRepository.buscarCategoriaPorNome).toHaveBeenCalledTimes(
        1,
      );
    });

    it('Deve ser possível criar uma nova categoria', async () => {
      // Arrange
      const categoriaDTO = makeCategoriaDTO(
        novaCategoriaModelMock.id,
        novaCategoriaModelMock.nome,
        novaCategoriaModelMock.descricao,
      );
      const categoriaEntity = new CategoriaEntity(
        categoriaDTO.nome,
        categoriaDTO.descricao,
        categoriaDTO.id,
      );
      const criaCategoriaDTO = makeCriaCategoriaDTO(
        categoriaDTO.nome,
        categoriaDTO.descricao,
      );

      jest
        .spyOn(categoriaFactory, 'criarEntidadeCategoriaFromCriaCategoriaDTO')
        .mockReturnValue(categoriaEntity);

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorNome')
        .mockReturnValue(Promise.resolve(null));

      jest
        .spyOn(categoriaRepository, 'criarCategoria')
        .mockReturnValue(Promise.resolve(novaCategoriaModelMock));

      jest
        .spyOn(categoriaDTOFactory, 'criarCategoriaDTO')
        .mockReturnValue(categoriaDTO);

      // Act
      const result = await categoriaUseCase.criarCategoria(criaCategoriaDTO);

      // Assert
      expect(result).toEqual({
        mensagem: 'Categoria criada com sucesso',
        body: categoriaDTO,
      });

      expect(categoriaRepository.buscarCategoriaPorNome).toHaveBeenCalledTimes(
        1,
      );
      expect(categoriaRepository.criarCategoria).toHaveBeenCalledTimes(1);
    });
  });

  describe('Editar categoria', () => {
    it('Deve ser lançado um erro se a categoria informada para edição não existe', async () => {
      // Arrange

      const categoriaDTO = new AtualizaCategoriaDTO();
      categoriaDTO.nome = 'Categoria atualizada';
      categoriaDTO.descricao = 'Descrição atualizada';

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(null));

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorNome')
        .mockReturnValue(Promise.resolve(null));

      // Act
      // Assert

      expect(
        categoriaUseCase.editarCategoria(
          '0a14aa4e-75e7-405f-8601-81f60646c93d',
          categoriaDTO,
        ),
      ).rejects.toThrow(
        new CategoriaNaoLocalizadaErro('Categoria informada não existe'),
      );

      expect(categoriaRepository.buscarCategoriaPorId).toHaveBeenCalledTimes(1);
    });

    it('Deve ser lançado um erro se a categoria informada para edição tiver o mesmo nome de uma categoria já registrada', async () => {
      // Arrange

      const atualizaCategoriaDTO = new AtualizaCategoriaDTO();
      atualizaCategoriaDTO.nome = novaCategoriaDTO.nome;
      const categoriaEntity = new CategoriaEntity(
        atualizaCategoriaDTO.nome,
        atualizaCategoriaDTO.descricao,
      );

      jest
        .spyOn(
          categoriaFactory,
          'criarEntidadeCategoriaFromAtualizaCategoriaDTO',
        )
        .mockReturnValue(categoriaEntity);

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(categoriaModelMock));

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorNome')
        .mockReturnValue(Promise.resolve(novaCategoriaModelMock));

      // Act
      // Assert

      expect(
        categoriaUseCase.editarCategoria(
          categoriaModelMock.id,
          atualizaCategoriaDTO,
        ),
      ).rejects.toThrow(
        new CategoriaDuplicadaErro('Existe uma categoria com esse nome'),
      );

      expect(categoriaRepository.buscarCategoriaPorId).toHaveBeenCalledTimes(1);
    });

    it('Deve ser possível editar uma categoria', async () => {
      // Arrange

      const atualizaCategoriaDto = new AtualizaCategoriaDTO();
      const categoriaDTO = makeCategoriaDTO(
        categoriaAtualizadaModelMock.id,
        categoriaAtualizadaModelMock.nome,
        categoriaAtualizadaModelMock.descricao,
      );
      const categoriaEntity = new CategoriaEntity(
        categoriaDTO.nome,
        categoriaDTO.descricao,
        categoriaDTO.id,
      );

      jest
        .spyOn(
          categoriaFactory,
          'criarEntidadeCategoriaFromAtualizaCategoriaDTO',
        )
        .mockReturnValue(categoriaEntity);

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(categoriaAtualizadaModelMock));

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorNome')
        .mockReturnValue(Promise.resolve(null));

      jest
        .spyOn(categoriaDTOFactory, 'criarCategoriaDTO')
        .mockReturnValue(categoriaDTO);

      jest
        .spyOn(categoriaRepository, 'editarCategoria')
        .mockReturnValue(Promise.resolve(categoriaAtualizadaModelMock));

      // Act

      const result = await categoriaUseCase.editarCategoria(
        categoriaAtualizadaModelMock.id,
        atualizaCategoriaDto,
      );

      // Assert

      expect(result).toEqual({
        mensagem: 'Categoria atualizada com sucesso',
        body: categoriaDTO,
      });

      expect(categoriaRepository.buscarCategoriaPorId).toHaveBeenCalledTimes(1);
      expect(categoriaRepository.editarCategoria).toHaveBeenCalledTimes(1);
    });
  });

  describe('Excluir categoria', () => {
    it('Deve ser retornado um erro se o id da categoria informada para exclusão não existir na base de dados', async () => {
      // Arrange

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(null));

      // Act
      // Assert

      expect(
        categoriaUseCase.excluirCategoria(
          '0a14aa4e-75e7-405f-8601-81f60646c93d',
        ),
      ).rejects.toThrow(
        new CategoriaNaoLocalizadaErro('Categoria informada não existe'),
      );

      expect(categoriaRepository.buscarCategoriaPorId).toHaveBeenCalledTimes(1);
    });

    it('Deve ser possível excluir uma categoria', async () => {
      // Arrange

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(categoriaAtualizadaModelMock));

      // Act

      const result = await categoriaUseCase.excluirCategoria(
        categoriaAtualizadaModelMock.id,
      );

      // Assert

      expect(result).toEqual({
        mensagem: 'Categoria excluida com sucesso',
      });

      expect(categoriaRepository.buscarCategoriaPorId).toHaveBeenCalledTimes(1);
      expect(categoriaRepository.excluirCategoria).toHaveBeenCalledTimes(1);
    });
  });

  describe('Buscar Categoria', () => {
    it('Deve deve retornado um erro ao tentar buscar uma categoria que o ID não esteja cadastrado no banco de dados', async () => {
      // Arrange

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(null));

      // Act
      // Assert

      expect(
        categoriaUseCase.buscarCategoria(
          '0a14aa4e-7587-405f-8601-81f60646c93d',
        ),
      ).rejects.toThrow(
        new CategoriaNaoLocalizadaErro('Categoria informada não existe'),
      );

      expect(categoriaRepository.buscarCategoriaPorId).toHaveBeenCalledTimes(1);
    });

    it('Deve ser possível buscar uma categoria por ID', async () => {
      // Arrange

      const categoriaDTO = makeCategoriaDTO(
        categoriaAtualizadaModelMock.id,
        categoriaAtualizadaModelMock.nome,
        categoriaAtualizadaModelMock.descricao,
      );

      jest
        .spyOn(categoriaRepository, 'buscarCategoriaPorId')
        .mockReturnValue(Promise.resolve(categoriaAtualizadaModelMock));

      jest
        .spyOn(categoriaDTOFactory, 'criarCategoriaDTO')
        .mockReturnValue(categoriaDTO);

      // Act

      const result = await categoriaUseCase.buscarCategoria(
        categoriaAtualizadaModelMock.id,
      );

      // Assert

      expect(result).toEqual(categoriaDTO);
    });
  });

  describe('Listar Categorias', () => {
    it('Deve ser possível retornar uma lista com todas as categorias cadastradas', async () => {
      // Arrange

      const categoria1DTO = makeCategoriaDTO(
        categoriaAtualizadaModelMock.id,
        categoriaAtualizadaModelMock.nome,
        categoriaAtualizadaModelMock.descricao,
      );

      const categoria2DTO = makeCategoriaDTO(
        novaCategoriaModelMock.id,
        novaCategoriaModelMock.nome,
        novaCategoriaModelMock.descricao,
      );

      const categoria3DTO = makeCategoriaDTO(
        categoriaModelMock.id,
        categoriaModelMock.nome,
        categoriaModelMock.descricao,
      );

      const listaCategorias: CategoriaDTO[] = [
        categoria1DTO,
        categoria2DTO,
        categoria3DTO,
      ];

      jest
        .spyOn(categoriaRepository, 'listarCategorias')
        .mockReturnValue(Promise.resolve(listaCategoriasModel));

      jest
        .spyOn(categoriaDTOFactory, 'criarListaCategoriaDTO')
        .mockReturnValue(listaCategorias);

      // Act

      const result = await categoriaUseCase.listarCategorias();

      // Assert

      expect(result).toEqual(listaCategorias);
    });

    it('Deve ser retornada uma lista vazia em casos onde não tem categorias criadas', async () => {
      // Arrange

      jest
        .spyOn(categoriaRepository, 'listarCategorias')
        .mockReturnValue(Promise.resolve([]));

      jest
        .spyOn(categoriaDTOFactory, 'criarListaCategoriaDTO')
        .mockReturnValue([]);

      // Act

      const result = await categoriaUseCase.listarCategorias();

      // Assert

      expect(result).toEqual([]);
    });
  });
});
