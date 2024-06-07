using P4.TinyCell.Shared.Language.AbstractSyntaxTree.Primitive;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.PinExpr;

public class PinWriteExprNode(AstNode from, IdentifierNode to) : PinExprNode(from, to)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitPinWriteExprNode(this);
    }
}