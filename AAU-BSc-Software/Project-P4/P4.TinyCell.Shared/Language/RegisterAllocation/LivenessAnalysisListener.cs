// using Antlr4.Runtime;
// using Antlr4.Runtime.Misc;


// namespace P4.TinyCell.Shared.Language.RegisterAllocation
// {
//     public class LivenessAnalysisListener : TinyCellBaseListener
//     {

//         private Stack<ParentStructure> parentStructureStack;

//         private List<IInstruction> prevInstructions;

//         public Dictionary<string, List<IInstruction>> scopes;

//         private Stack<string> scopeStack;


//         private bool isAssigned;

//         public LivenessAnalysisListener()
//         {
//             parentStructureStack = new Stack<ParentStructure>();
//             prevInstructions = new List<IInstruction>();
//             scopes = new Dictionary<string, List<IInstruction>>();
//             scopeStack = new Stack<string>();

//         }

//         public override void EnterDocument([NotNull] TinyCellParser.DocumentContext context)
//         {
//             parentStructureStack.Push(new ParentStructure());
//             parentStructureStack.First().compundStack.Push(new Scope());
//             scopes.Add("document", new List<IInstruction>());
//             scopeStack.Push("document");
//         }

//         public override void EnterFunctionDefinition([NotNull] TinyCellParser.FunctionDefinitionContext context)
//         {
//             parentStructureStack.Push(new ParentStructure());
//             parentStructureStack.First().compundStack.Push(new Scope());
//             var identifierName = context.identifier().GetText();
//             scopes.Add(identifierName, new List<IInstruction>());
//             scopeStack.Push(identifierName);
//         }
//         public override void EnterFunctionCall([NotNull] TinyCellParser.FunctionCallContext context)
//         {
//             if (context.Parent is TinyCellParser.StatementContext)
//             {
//                 var instruction = new Instruction<TinyCellParser.FunctionCallContext>(context);
//                 scopes[scopeStack.First()].Add(instruction);
//                 prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//                 prevInstructions.Clear();
//                 prevInstructions.Add(instruction);
//                 if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//                 {
//                     parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//                 }
//                 isAssigned = true;
//             }
//         }

//         public override void ExitFunctionCall([NotNull] TinyCellParser.FunctionCallContext context)
//         {
//             if (context.Parent is TinyCellParser.StatementContext)
//             {
//                 isAssigned = false;
//             }
//         }


//         public override void ExitFunctionDefinition([NotNull] TinyCellParser.FunctionDefinitionContext context)
//         {
//             parentStructureStack.Pop();
//             scopeStack.Pop();
//         }

//         public override void EnterJumpStatement([NotNull] TinyCellParser.JumpStatementContext context)
//         {
//             var instruction = new Instruction<TinyCellParser.JumpStatementContext>(context);
//             scopes[scopeStack.First()].Add(instruction);
//             prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//             prevInstructions.Clear();
//             prevInstructions.Add(instruction);
//             if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//             {
//                 parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//             }
//             isAssigned = true;
//         }


//         public override void EnterPinStatusExpression([NotNull] TinyCellParser.PinStatusExpressionContext context)
//         {
//             var instruction = new Instruction<TinyCellParser.PinStatusExpressionContext>(context);
//             scopes[scopeStack.First()].Add(instruction);
//             prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//             prevInstructions.Clear();
//             prevInstructions.Add(instruction);
//             if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//             {
//                 parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//             }
//             isAssigned = true;
//         }

//         public override void ExitPinStatusExpression([NotNull] TinyCellParser.PinStatusExpressionContext context)
//         {
//             isAssigned = false;
//         }


//         public override void EnterSetupDefinition([NotNull] TinyCellParser.SetupDefinitionContext context)
//         {
//             var parentStructure = new ParentStructure();
//             parentStructure.compundStack.Push(new Scope());
//             parentStructureStack.Push(parentStructure);
//             scopes.Add("setup", new List<IInstruction>());
//             scopeStack.Push("setup");
//         }

//         public override void ExitSetupDefinition([NotNull] TinyCellParser.SetupDefinitionContext context)
//         {
//             parentStructureStack.Pop();
//             scopeStack.Pop();
//         }

//         public override void EnterUpdateDefinition([NotNull] TinyCellParser.UpdateDefinitionContext context)
//         {
//             var parentStructure = new ParentStructure();
//             parentStructure.compundStack.Push(new Scope());
//             parentStructureStack.Push(parentStructure);
//             scopes.Add("update", new List<IInstruction>());
//             scopeStack.Push("update");
//         }

//         public override void ExitUpdateDefinition([NotNull] TinyCellParser.UpdateDefinitionContext context)
//         {
//             parentStructureStack.Pop();
//             scopeStack.Pop();
//         }

//         public override void EnterCompoundStatement([NotNull] TinyCellParser.CompoundStatementContext context)
//         {
//             if (context.children.Count > 2)
//             {
//                 parentStructureStack.First().compundStack.Push(new Scope());
//             }
//         }

//         public override void ExitCompoundStatement([NotNull] TinyCellParser.CompoundStatementContext context)
//         {
//             if (prevInstructions.Count != 0)
//             {
//                 parentStructureStack.First().compundStack.First().lastInstruction = prevInstructions.First();
//             }
//             prevInstructions.Clear();
//         }


//         public override void EnterIfStatement([NotNull] TinyCellParser.IfStatementContext context)
//         {
//             var instruction = new Instruction<TinyCellParser.IfStatementContext>(context);
//             scopes[scopeStack.First()].Add(instruction);
//             prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//             prevInstructions.Clear();
//             if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//             {
//                 parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//             }
//             var parentStructure = new ParentStructure();
//             parentStructure.Instruction = instruction;
//             parentStructureStack.Push(parentStructure);
//         }

//         public override void ExitIfStatement([NotNull] TinyCellParser.IfStatementContext context)
//         {
//             var parentStructure = parentStructureStack.First();
//             foreach (var scope in parentStructure.compundStack)
//             {
//                 parentStructure.Instruction.addSucc(scope.firstInstruction);
//                 prevInstructions.Add(scope.lastInstruction);
//             }
//             if (parentStructure.compundStack.Count <= 1)
//             {
//                 prevInstructions.Add(parentStructure.Instruction);
//             }
//             parentStructureStack.Pop();
//         }

//         public override void EnterLoopStatement([NotNull] TinyCellParser.LoopStatementContext context)
//         {
//             var instruction = new Instruction<TinyCellParser.LoopStatementContext>(context);
//             scopes[scopeStack.First()].Add(instruction);
//             prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//             prevInstructions.Clear();
//             if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//             {
//                 parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//             }
//             var parentStructure = new ParentStructure();
//             parentStructure.Instruction = instruction;
//             parentStructureStack.Push(parentStructure);

//         }

//         public override void ExitLoopStatement([NotNull] TinyCellParser.LoopStatementContext context)
//         {
//             var parentStructure = parentStructureStack.First();
//             foreach (var scope in parentStructure.compundStack)
//             {
//                 if (scope.firstInstruction != null && scope.lastInstruction != null)
//                 {
//                     parentStructure.Instruction.addSucc(scope.firstInstruction);
//                     prevInstructions.Add(scope.lastInstruction);
//                 }
//             }
//             if (parentStructure.compundStack.Count <= 1)
//             {
//                 prevInstructions.Add(parentStructure.Instruction);
//             }
//             parentStructureStack.Pop();
//         }

//         public override void EnterDeclaration([NotNull] TinyCellParser.DeclarationContext context)
//         {
//             var instruction = new Instruction<TinyCellParser.DeclarationContext>(context);
//             scopes[scopeStack.First()].Add(instruction);
//             prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//             prevInstructions.Clear();
//             prevInstructions.Add(instruction);
//             if (context.Parent is TinyCellParser.LoopStatementContext)
//             {
//                 return;
//             }
//             if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//             {
//                 parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//             }
//         }

//         public override void EnterAssignment([NotNull] TinyCellParser.AssignmentContext context)
//         {
//             var instruction = new Instruction<TinyCellParser.AssignmentContext>(context);
//             scopes[scopeStack.First()].Add(instruction);
//             prevInstructions.ForEach(prevInstruction => prevInstruction.addSucc(instruction));
//             prevInstructions.Clear();
//             prevInstructions.Add(instruction);
//             if (parentStructureStack.First().compundStack.First().firstInstruction == null)
//             {
//                 parentStructureStack.First().compundStack.First().firstInstruction = instruction;
//             }
//         }

//         public override void EnterExpression([NotNull] TinyCellParser.ExpressionContext context)
//         {
//             isAssigned = true;
//         }

//         public override void ExitExpression([NotNull] TinyCellParser.ExpressionContext context)
//         {
//             isAssigned = false;
//         }

//         public override void EnterIdentifier([NotNull] TinyCellParser.IdentifierContext context)
//         {
//             if (context.Parent is TinyCellParser.FunctionCallContext || context.Parent is TinyCellParser.FunctionDefinitionContext || context.Parent is TinyCellParser.ParameterContext)
//             {
//                 return;
//             }
//             if (context.Parent is TinyCellParser.LoopStatementContext)
//             {
//                 parentStructureStack.First().Instruction.addGen(context);
//             }
//             if (isAssigned)
//             {
//                 scopes[scopeStack.First()].Last().addGen(context);

//             }
//             else
//             {
//                 scopes[scopeStack.First()].Last().addKill(context);
//             }
//         }

//         private class ParentStructure
//         {
//             public IInstruction? Instruction;
//             public Stack<Scope> compundStack { get; set; }

//             public ParentStructure()
//             {
//                 compundStack = new Stack<Scope>();
//             }
//         }

//         //<summary>
//         //Performs fixed point analysis on <see cref="scopes"/>
//         //</summary>
//         public void FixedPointAnalysis()
//         {
//             foreach (var scopeInstructions in scopes.Values)
//             {
//                 if (scopeInstructions.Count == 0)
//                 {
//                     continue;
//                 }
//                 InitializeFirstOut(scopeInstructions);
//                 List<IInstruction> instructionsCopy;
//                 do
//                 {
//                     instructionsCopy = scopeInstructions.Select(instruction => (IInstruction)instruction.Clone()).ToList();
//                     for (int i = scopeInstructions.Count - 1; i >= 0; i--)
//                     {
//                         var instruction = scopeInstructions[i];
//                         Update(instruction);
//                     }
//                 } while (!IsListEqual(instructionsCopy, scopeInstructions));
//             }
//         }


//         //<summary>
//         // Makes sure that the last instruction <see cref="Instruction{T}.gen"></see> as its <see cref="Instruction{T}.ins"/>
//         //</summary>
//         //<param name="instructions"></param>
//         private void InitializeFirstOut(List<IInstruction> instructions)
//         {
//             for (int i = instructions.Count - 1; i >= 0; i--)
//             {
//                 if (instructions[i].getGen().Count != 0)
//                 {
//                     var lastInstructionIns = instructions[i].getIns();
//                     var lastInstructionGen = instructions[i].getGen();
//                     lastInstructionIns.UnionWith(lastInstructionGen);
//                     instructions[i].setIns(lastInstructionIns);
//                     break;
//                 }
//             }
//         }


//         private bool IsListEqual(List<IInstruction> list1, List<IInstruction> list2)
//         {
//             for (int i = 0; i < list1.Count; i++)
//             {
//                 var instruction1 = list1[i];
//                 var instruction2 = list2[i];

//                 Compare properties of the instructions
//                 if (!areInstructionsEqual(instruction1, instruction2))
//                 {
//                     return false;
//                 }
//             }
//             return true;


//         }

//         private bool areInstructionsEqual(IInstruction instruction1, IInstruction instruction2)
//         {
//             if (!instruction1.getIns().SetEquals(instruction2.getIns()))
//             {
//                 return false;
//             }
//             if (!instruction1.getOuts().SetEquals(instruction2.getOuts()))
//             {
//                 return false;
//             }
//             return true;
//         }

//         private void Update(IInstruction instruction)
//         {
//             UpdateOuts(instruction);
//             UpdateIns(instruction);
//         }

//         private void UpdateOuts(IInstruction instruction)
//         {
//             var instructionOuts = instruction.getOuts();
//             foreach (var succ in instruction.getSucc())
//             {
//                 instructionOuts.UnionWith(succ.getIns());
//             }
//             instruction.setOuts(instructionOuts);
//         }

//         private void UpdateIns(IInstruction instruction)
//         {
//             var gen = instruction.getGen();
//             var outs = instruction.getOuts();
//             var kill = instruction.getKill();
//             var outsMinusKill = new HashSet<string>(outs);
//             outsMinusKill.ExceptWith(kill);
//             var newIns = gen.Union(outsMinusKill).ToHashSet();
//             instruction.setIns(newIns);
//         }

//         private class Scope
//         {
//             public IInstruction? firstInstruction { get; set; }
//             public IInstruction? lastInstruction { get; set; }
//         }
//     }

//     / <summary>
//     / Represents an instruction in the liveliness analysis./// </summary>
//     / <typeparam name="T">The type of <see cref="ParserRuleContext"/> instruction  </typeparam>
//     public class Instruction<T> : IInstruction where T : ParserRuleContext
//     {
//         /// <summary>
//         /// Gets or sets the instruction.
//         /// </summary>
//         public T? baseInstruction { get; set; }

//         public Instruction(T instruction)
//         {
//             baseInstruction = instruction;
//             gen = [];
//             kill = [];
//             succ = [];
//             outs = new HashSet<string>();
//             ins = new HashSet<string>();
//         }

//         /// <summary>
//         /// Gets or sets the set of variables generated by this instruction.
//         /// </summary>
//         public HashSet<string>? gen { get; set; }

//         /// <summary>
//         /// Gets or sets the set of variables killed by this instruction.
//         /// </summary>
//         public HashSet<string>? kill { get; set; }

//         /// <summary>
//         /// Gets or sets the set of succeeding instructions
//         /// </summary>
//         public HashSet<IInstruction>? succ { get; set; }

//         public HashSet<string>? outs { get; set; }

//         public HashSet<string>? ins { get; set; }

//         public void addGen(TinyCellParser.IdentifierContext context)
//         {
//             gen.Add(context.GetText());
//         }

//         public void addKill(TinyCellParser.IdentifierContext context)
//         {
//             kill.Add(context.GetText());
//         }

//         public void addSucc(IInstruction instruction)
//         {
//             succ.Add(instruction);

//         }

//         public HashSet<IInstruction> getSucc()
//         {
//             return succ;
//         }

//         public HashSet<string> getIns()
//         {
//             return ins;
//         }

//         public HashSet<string> getGen()
//         {
//             return gen;
//         }

//         public HashSet<string> getOuts()
//         {
//             return outs;
//         }

//         public HashSet<string> getKill()
//         {
//             return kill;
//         }

//         public void setIns(HashSet<string> newIns)
//         {
//             ins = newIns;
//         }

//         public void setOuts(HashSet<string> newOuts)
//         {
//             outs = newOuts;
//         }

//         public object Clone()
//         {
//             Instruction<T> clone = new Instruction<T>(baseInstruction);

//             clone.gen = new HashSet<string>(gen);
//             clone.kill = new HashSet<string>(kill);
//             clone.succ = new HashSet<IInstruction>(succ);
//             clone.outs = new HashSet<string>(outs);
//             clone.ins = new HashSet<string>(ins);

//             return clone;
//         }

//     }
//     /// <summary>
//     /// Interface to generalize instruction to generic
//     /// </summary>
//     public interface IInstruction : ICloneable
//     {
//         public void addGen(TinyCellParser.IdentifierContext context);

//         public void addKill(TinyCellParser.IdentifierContext context);

//         public void addSucc(IInstruction instruction);

//         public HashSet<IInstruction> getSucc();

//         public HashSet<string> getIns();

//         public HashSet<string> getGen();

//         public HashSet<string> getOuts();

//         public HashSet<string> getKill();

//         public void setIns(HashSet<string> newSet);
//         public void setOuts(HashSet<string> newOuts);
//     }

// }

