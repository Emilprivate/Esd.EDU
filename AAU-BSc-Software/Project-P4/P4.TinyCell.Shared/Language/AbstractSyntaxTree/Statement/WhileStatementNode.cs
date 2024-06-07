namespace P4.TinyCell.Shared.Language.AbstractSyntaxTree.Statement;

public class WhileStatementNode : AstNode
{
    public AstNode Condition { get; set; }
    public AstNode CompoundStatement { get; set; }

    public WhileStatementNode(AstNode condition, AstNode compoundStatement)
    {
        Condition = condition;
        CompoundStatement = compoundStatement;

        AddChild(Condition);
        AddChild(CompoundStatement);
    }

    public override T Accept<T>(IAstVisitor<T> visitor)
    {
        return visitor.VisitWhileStatementNode(this);
    }
}