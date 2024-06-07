namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Expression;

public class NegativeExpressionNode : AstNode
{
    public AstNode Expression { get; set; }

    public NegativeExpressionNode(AstNode expression)
    {
        Expression = expression;
        AddChild(expression);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitNegativeExpressionNode(this);
    }
}