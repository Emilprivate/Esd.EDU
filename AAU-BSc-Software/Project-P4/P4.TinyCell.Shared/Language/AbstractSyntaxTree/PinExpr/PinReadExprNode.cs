using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;

public class PinReadExprNode(AstNode from, IdentifierNode to) : PinExprNode(from, to)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitPinReadExprNode(this);
    }
}