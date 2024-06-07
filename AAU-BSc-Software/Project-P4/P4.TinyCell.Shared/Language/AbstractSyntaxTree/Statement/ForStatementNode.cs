namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;

public class ForStatementNode : AstNode
{
    public AstNode Variable { get; set; }
    public AstNode Expression { get; set; }
    public AstNode Condition { get; set; }
    public AstNode CompoundStatement { get; set; }

    public ForStatementNode(AstNode variable, AstNode condition, AstNode expression, AstNode compoundStatement)
    {
        Variable = variable;
        Condition = condition;
        Expression = expression;
        CompoundStatement = compoundStatement;

        AddChild(Variable);
        AddChild(Condition);
        AddChild(Expression);
        AddChild(CompoundStatement);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitForStatementNode(this);
    }
}