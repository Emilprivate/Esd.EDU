namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;

public class AddExprNode(AstNode left, AstNode right) : BinExprNode(left, right)
{
    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitAddExprNode(this);
    }
}