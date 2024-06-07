using P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;

namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.BitwiseExpr;

public class BitshiftLExprNode(AstNode left, AstNode right) : BinExprNode(left, right)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitBitshiftLExprNode(this);
    }
}