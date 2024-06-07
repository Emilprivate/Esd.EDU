using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;
using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Types;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;

public class DeclarationNode : AstNode
{
    public TypeNode Type { get; set; }
    public IdentifierNode Identifier { get; set; }
    public AstNode? Action { get; set; }

    public DeclarationNode(TypeNode type, IdentifierNode identifier)
    {
        Type = type;
        Identifier = identifier;
        AddChild(type);
        AddChild(identifier);
    }

    public DeclarationNode(TypeNode type, IdentifierNode identifier, AstNode action)
    {
        Type = type;
        Identifier = identifier;
        Action = action;
        AddChild(type);
        AddChild(identifier);
        AddChild(action);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitDeclarationNode(this);
    }
}