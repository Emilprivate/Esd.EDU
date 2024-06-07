namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.NumExpr;

public abstract class BinExprNode : AstNode
{
    public AstNode Left { get; set; }
    public AstNode Right { get; set; }

    public BinExprNode(AstNode left, AstNode right)
    {
        Left = left;
        Right = right;

        AddChild(left);
        AddChild(right);
    }
}