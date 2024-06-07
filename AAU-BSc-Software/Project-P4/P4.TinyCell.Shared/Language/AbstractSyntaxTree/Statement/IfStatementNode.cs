namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;

public class IfStatementNode : AstNode
{
    public AstNode Condition { get; set; }
    public AstNode TrueExpr { get; set; }
    public AstNode? ElseExpr { get; set; }

    public IfStatementNode(AstNode condition, AstNode trueExpr, AstNode? elseExpr)
    {
        Condition = condition;
        TrueExpr = trueExpr;
        ElseExpr = elseExpr;

        AddChild(condition);
        AddChild(trueExpr);
        if (ElseExpr != null)
        {
            AddChild(ElseExpr);
        }
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitIfStatementNode(this);
    }
}