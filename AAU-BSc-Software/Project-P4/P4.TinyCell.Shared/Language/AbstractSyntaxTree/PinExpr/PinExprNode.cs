using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;

public abstract class PinExprNode : AstNode
{
    public AstNode From { get; set; }
    public IdentifierNode To { get; set; }

    public PinExprNode(AstNode from, IdentifierNode to)
    {
        From = from;
        To = to;

        AddChild(from);
        AddChild(to);
    }
}