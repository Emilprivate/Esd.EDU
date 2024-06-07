using P4.TinyCell.Shared.Language.AbstractSyntaxTree.ParameterNodes;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Function;

public class FunctionDefinitionNode : AstNode
{
    public TypeNode Type { get; set; }
    public IdentifierNode Identifier { get; set; }
    public ParameterListNode ParameterList { get; set; }
    public StatementCollectionNode? CompoundStatement { get; set; }

    public FunctionDefinitionNode(TypeNode type, IdentifierNode identifier, ParameterListNode parameterList,
        StatementCollectionNode? compoundStatement = null)
    {
        Type = type;
        Identifier = identifier;
        ParameterList = parameterList;

        AddChild(type);
        AddChild(identifier);
        AddChild(parameterList);

        if (compoundStatement is not null)
        {
            CompoundStatement = compoundStatement;
            AddChild(compoundStatement);
        }
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitFunctionDefinitionNode(this);
    }
}