using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Assignment;

public abstract class AssignmentBaseNode : AstNode
{
    public IdentifierNode Identifier { get; set; }
    public AstNode Expression { get; set; }

    public AssignmentBaseNode(IdentifierNode identifier, AstNode expression)
    {
        Identifier = identifier;
        Expression = expression;

        AddChild(Identifier);
        AddChild(Expression);
    }
}