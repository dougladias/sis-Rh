import prismaClient from "../../prisma";

class DeleteTemplateService {
  async execute(id: string) {
    if (!id) {
      throw new Error("ID do template é obrigatório");
    }

    // Verificar se o template existe
    const templateExists = await prismaClient.template.findUnique({
      where: { id }
    });

    if (!templateExists) {
      throw new Error("Template não encontrado");
    }

    // Excluir o template
    await prismaClient.template.delete({
      where: { id }
    });

    return true;
  }
}

export { DeleteTemplateService };